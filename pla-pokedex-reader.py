from flask import Flask, flash, render_template, request
from pla.core.pokedex import Pokedex

app = Flask(__name__)
# Set max size for uploads
app.config['MAX_CONTENT_LENGTH'] = 2 * 1000 * 1000

pokedex = Pokedex()

@app.route('/')
def home():
    return render_template('index.html', js='pla-pokedex-reader.js', pokemon=pokedex.hisuidex())

@app.route('/api/hisuidex')
def pokemon():
    return { 'hisuidex': pokedex.hisuidex() }

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'save' not in request.files:
            return { 'error': 'No file selected' }
        save = request.files['save']

        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if save.filename == '':
            return { 'error': 'No save selected' }

        if save:
            print(save.content_length)
            savedata = save.read();
            print(len(savedata))
            return { 'size': len(savedata)}

if __name__ == '__main__':
    app.run(host='localhost', port=8100, debug=False, threaded=True)