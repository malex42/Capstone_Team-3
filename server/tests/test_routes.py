from flask import Flask, request, jsonify
app = Flask(__name__)
@app.route('/api/auth/register', methods=['POST'])

