import string
import random


def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


def jsonify_keys(original: dict | list[dict], keys_to_convert: list[str]) -> dict | list[dict]:
    # Helper function to convert keys in a single dictionary
    def convert_keys(doc: dict) -> dict:
        return {**doc, **{key: str(doc[key]) for key in keys_to_convert if key in doc}}

    if isinstance(original, list):
        # If input is a list of dicts, convert each dict
        return [convert_keys(doc) for doc in original]
    elif isinstance(original, dict):
        # If input is a single dict, convert it directly
        return convert_keys(original)
    else:
        raise TypeError("Input must be a dict or a list of dicts.")
