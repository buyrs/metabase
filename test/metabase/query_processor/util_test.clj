(ns metabase.query-processor.util-test
  "Tests for various functions that provide information about the query."
  (:require
   [buddy.core.codecs :as codecs]
   [clojure.test :refer :all]
   [metabase.query-processor.util :as qp.util]))

(set! *warn-on-reflection* true)

(deftest ^:parallel query-without-aggregations-or-limits?-test
  (are [x expected] (= expected
                       (qp.util/query-without-aggregations-or-limits? x))
    {:query {:aggregation [[:count]]}} false
    {:query {}}                        true
    {:query {:aggregation [[:count]]
             :limit       10}}         false
    {:query {:aggregation [[:count]]
             :page        1}}          false))

(defn- byte-array= {:style/indent 0}
  ([^bytes a ^bytes b]
   (java.util.Arrays/equals a b))
  ([a b & more]
   (and (byte-array= a b)
        (apply byte-array= b more))))

(deftest ^:parallel query-hash-test
  (testing "qp.util/query-hash"
    (testing "should always hash something the same way, every time"
      (is (byte-array=
            (byte-array [124 17 52 -28 71 -73 107 4 -108 39 42 -6 15 36 58 46 93 -59 103 -123 101 78 15 63 -10 -110 55 100 91 122 71 -23])
            (qp.util/query-hash {:query :abc})))
      (is (byte-array=
            (qp.util/query-hash {:query :def})
            (qp.util/query-hash {:query :def}))))

    (testing "different queries should produce different hashes"
      (is (not (byte-array=
                 (qp.util/query-hash {:query :abc})
                 (qp.util/query-hash {:query :def}))))
      (is (not (byte-array=
                 (qp.util/query-hash {:query :abc, :database 1})
                 (qp.util/query-hash {:query :abc, :database 2}))))
      (is (not (byte-array=
                 (qp.util/query-hash {:query :abc, :type "query"})
                 (qp.util/query-hash {:query :abc, :type "native"}))))
      (is (not (byte-array=
                 (qp.util/query-hash {:query :abc, :parameters [1]})
                 (qp.util/query-hash {:query :abc, :parameters [2]}))))
      (is (not (byte-array=
                 (qp.util/query-hash {:query :abc, :constraints {:max-rows 1000}})
                 (qp.util/query-hash {:query :abc, :constraints nil})))))

    (testing "keys that are irrelevant to the query should be ignored"
      (is (byte-array=
            (qp.util/query-hash {:query :abc, :random :def})
            (qp.util/query-hash {:query :abc, :random :xyz}))))

    (testing "empty `:parameters` lists should not affect the hash"
      (is (byte-array=
            (qp.util/query-hash {:query :abc})
            (qp.util/query-hash {:query :abc, :parameters []})
            (qp.util/query-hash {:query :abc, :parameters nil})))

      (testing "...but non-empty ones should"
        (is (not (byte-array=
                   (qp.util/query-hash {:query :abc})
                   (qp.util/query-hash {:query :abc, :parameters ["ABC"]})))))

      (testing (str "the presence of a `nil` value for `:constraints` should produce the same hash as not including "
                    "the key at all")
        (is (byte-array=
              (qp.util/query-hash {:query :abc})
              (qp.util/query-hash {:query :abc, :constraints nil})
              (qp.util/query-hash {:query :abc, :constraints {}})))))

    (testing "make sure two different native queries have different hashes!"
      (is (not (byte-array=
                 (qp.util/query-hash {:database 2
                                      :type     "native"
                                      :native   {:query "SELECT pg_sleep(15), 1 AS one"}})
                 (qp.util/query-hash {:database 2
                                      :type     "native"
                                      :native   {:query "SELECT pg_sleep(15), 2 AS two"}})))))))

(deftest ^:parallel key-order-should-not-affect-query-hash-test
  (is (= "7e144bc5b43ee850648f353cda978b2911e2f66260ac03c5e1744bce6ca668ff"
         (codecs/bytes->hex (qp.util/query-hash {:parameters [{:value 1, :name "parameter"}]}))
         (codecs/bytes->hex (qp.util/query-hash {:parameters [{:name "parameter", :value 1}]})))))
