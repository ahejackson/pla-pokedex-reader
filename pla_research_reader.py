from flask import Flask, render_template, request
from pla.core.pokedex import Pokedex
from pla.saves.pla_save_reader import read_research

app = Flask(__name__)
# Set max size for uploads
app.config['MAX_CONTENT_LENGTH'] = 2 * 1000 * 1000

pokedex = Pokedex()
hisuidex = pokedex.hisuidex()

@app.route('/')
def home():
    return render_template('index.html', js='pla-research-reader.js', pokemon=pokedex.hisuidex())

@app.route('/api/hisuidex')
def pokemon():
    return { 'hisuidex': hisuidex }

@app.route('/api/read-research', methods=['POST'])
def read_savefile():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'save' not in request.files:
            return { 'error': 'There was no save file selected' }
        save = request.files['save']

        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if save.filename == '':
            return { 'error': 'There was no save file selected' }

        if save:
            savedata = bytearray(save.read());
            results = read_research(savedata)
            if 'error' in results:
                return { 'error': results['error'] }

            rolls = { pkm['name'] : get_rolls(results['research_entries'], pkm) for pkm in hisuidex}
            
            return {
                'shinycharm': results['shinycharm'],
                'rolls': rolls
            }
    
    return { 'error': 'There was a problem reading your save' }

def get_rolls(research, pkm):
    if research[pkm['dex_national']]['perfect']:
        return 3
    elif research[pkm['dex_national']]['level10']:
        return 1
    else:
        return 0


if __name__ == '__main__':
    app.run(host='localhost', port=8100, debug=False, threaded=True)