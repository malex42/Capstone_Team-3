import os
from server import Server
from configurations.config_manager import ConfigurationManager


if __name__ == '__main__':
    config = ConfigurationManager(os.path.join('configurations', 'config.yaml'))
    server = Server(config)

    server.run(debug=True)
    