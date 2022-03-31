from flask import Flask, render_template, request
from pla.core.pokedex import Pokedex

app = Flask(__name__)
pokedex = Pokedex()

@app.route('/')
def home():
    return render_template('index.html', js='pla-pokedex-reader.js', pokemon=pokedex.hisuidex())

@app.route('/api/hisuidex')
def pokemon():
    return { 'hisuidex': pokedex.hisuidex() }

if __name__ == '__main__':
    app.run(host='localhost', port=8100, debug=False, threaded=True)