import yaml


class ConfigurationManager:

    def __init__(self, config_path):
        self.SERVER_PORT = None
        self.SERVER_HOST = None
        self.JWT_SECRET_KEY = None
        self.MONGO_URI = None

        with open(config_path, 'r') as config_file:
            self.configuration = yaml.safe_load(config_file)

        self.initialize_variables()

    def initialize_variables(self):
        self.MONGO_URI = self.configuration['MONGO_URI']
        self.JWT_SECRET_KEY = self.configuration['JWT_SECRET_KEY']
        self.SERVER_HOST = self.configuration['SERVER_HOST']
        self.SERVER_PORT = self.configuration['SERVER_PORT']
