import unittest

from compare_checkpoints import compare


class CompareCheckpointsTest(unittest.TestCase):
    def test_matches_all_available_state(self):
        row = {"frame": 7, "geometry": [320, 240, 2], "video": "v", "audio": "a", "state": "s"}
        self.assertEqual([], compare({7: row}, {7: dict(row)}, [{"name": "title", "frame": 7}]))

    def test_reports_missing_and_different_hashes(self):
        failures = compare(
            {7: {"frame": 7, "video": "a"}},
            {7: {"frame": 7, "video": "b"}},
            [{"name": "title", "frame": 7}, {"name": "end", "frame": 8}],
        )
        self.assertEqual(["title: frame 7 video mismatch", "end: missing frame 8"], failures)


if __name__ == "__main__":
    unittest.main()
