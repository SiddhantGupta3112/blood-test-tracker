def validate_test_name(name):
    '''
    Docstring for validate_test_name
    
    name -- the string to verify
    return False if invalid
    return True if valid
    '''
    if name is None:
        return False
    if len(name) < 2 or len(name) > 150:
        return False
    return True

def validate_test_values(val):
    '''
    Docstring for validate_test_values
    
    val -- numeric string to be verified
    return False if invalid
    return True if valid
    '''
    if val is None:
        return False
    if val < 0 or val > 99999999:
        return False
    return True

def validate_test_units(unit):
    '''
    Docstring for validate_test_units
    
    unit -- string to be verified

    return False if invalid
    return True if valid
    '''
    if unit is None:
        return True
    if len(unit) > 15:
        return False
    return True

def validate_test_ref_ranges(ref_range):
    '''
    Docstring for validate_test_ref_ranges
    
    ref_range -- string to be validated

    return False if invalid
    return True if valid
    '''
    if ref_range is None:
        return True
    if len(ref_range) == 0:
        return True
    if len(ref_range) > 20:
        return False
    
    if not ('-' in ref_range or '>' in ref_range or '<' in ref_range):
        return False
    return True


def validate(name, val, unit, ref):
    return validate_test_name(name) and validate_test_values(val) and validate_test_units(unit) and validate_test_ref_ranges(ref)