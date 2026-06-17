from app.crud.test_results import is_abnormal

def test_is_abnormal_above_upper_bound():
    assert is_abnormal(120.0, 70.0, 100.0) is True

def test_is_abnormal_below_lower_bound():
    assert is_abnormal(50.0, 70.0, 100.0) is True

def test_is_abnormal_within_range():
    assert is_abnormal(85.0, 70.0, 100.0) is False

def test_is_abnormal_no_bounds():
    assert is_abnormal(85.0, None, None) is None

def test_is_abnormal_only_upper_bound():
    assert is_abnormal(120.0, None, 100.0) is True
    
def test_is_abnormal_exactly_at_lower_bound():
    assert is_abnormal(70.0, 70.0, 100.0) is False

def test_is_abnormal_exactly_at_upper_bound():
    assert is_abnormal(100.0, 70.0, 100.0) is False

def test_is_abnormal_only_lower_bound_below():
    assert is_abnormal(50.0, 70.0, None) is True

def test_is_abnormal_only_lower_bound_above():
    assert is_abnormal(85.0, 70.0, None) is False

def test_is_abnormal_only_upper_bound_within():
    assert is_abnormal(85.0, None, 100.0) is False

def test_is_abnormal_inverted_bounds():
    assert is_abnormal(85.0, 100.0, 70.0) is True