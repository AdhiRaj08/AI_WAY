"""
Flask Application for handling HTTP requests and responses.

This application defines routes for handling user requests from JS.
Below are the necessary libraries and models used in the project
"""

from flask import Flask, url_for, redirect, render_template, Response, request, jsonify, json
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
import goslate
import pdfplumber       
import nltk
import pickle
from tensorflow.keras.models import load_model
import numpy as np
from keras.models import load_model
from transformers import AutoTokenizer, AutoModelForQuestionAnswering
import torch
import PyPDF2
import gensim.corpora as corpora
from gensim.models import LdaModel
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from googletrans import Translator
from langchain_community.document_loaders import PyPDFLoader

# Global Variables and Models
text_content = ""                                          
tokens = ""                                                 # Stores tokenized words
from flask_cors import CORS  # Import CORS
nltk.download('stopwords')
app = Flask(__name__)
CORS(app)  
tokenizer = AutoTokenizer.from_pretrained("models/saved_model/")
model = AutoModelForQuestionAnswering.from_pretrained("models/saved_model/")

lstm_model = load_model('models/lstm_model/next_words.h5')
lstm_tokenizer = pickle.load(open('models/lstm_model/token.pkl', 'rb'))

@app.route("/")
def home():
   """
    Renders the home page template.

    :return: A rendered HTML template for the home page.
    """
   return render_template("bo.html")
stop_words = set(stopwords.words('english'))
def preprocess(doc):
    return [word for word in doc.lower().split() if word not in stop_words]

    
@app.route('/upload', methods = ['POST'])
def submit():
    """
    Accepts Form inputs and utilize them in generating answer using sota models

    :return: The Corpus/text fetched as per the scope of question in JSON Format.
    """
    if request.method == 'POST':
        content = request.files['pdf']
        document = ""
        if content.filename == '':
            return jsonify({"error": "No selected file"}), 400
    
        with pdfplumber.open(content) as pdf:
            for page in pdf.pages:
                document += page.extract_text()
               
        question = request.form.get('search', None)
        
        if not question:
            return jsonify({'error': 'No question provided'}), 400
    
        # Perform language conversion using Googlelens API
        translator = Translator()
        question = translator.translate(question, dest='en').text

        # Translated Questions are sent into QnA system for information retrival
        inputs = tokenizer.encode_plus(question, document, add_special_tokens=True,  
            max_length=512,  # Truncate to the max length (depends on model)
            padding='max_length',  # Pad to the max length if needed
            truncation=True,  # Truncate if the text is too long
            return_tensors="pt"  # Return as PyTorch tensors return_tensors="pt")
        )
        # Get answer
        outputs = model(**inputs)
        answer_start = torch.argmax(outputs.start_logits)
        answer_end = torch.argmax(outputs.end_logits) + 1
        answer = tokenizer.convert_tokens_to_string(tokenizer.convert_ids_to_tokens(inputs["input_ids"][0][answer_start:answer_end]))
        answer = answer.replace(question, '').strip()
       
        if answer.strip() == "<s>":
            answer = "No answer found."


        
         #Topic Modelling using LDA
        processed_docs = [preprocess(doc) for doc in document]

        dictionary = corpora.Dictionary(processed_docs)
        corpus = [dictionary.doc2bow(doc) for doc in processed_docs]
        num_topics = 4
        lda_model = LdaModel(corpus, num_topics=num_topics, id2word=dictionary, passes=10)

        topics_payload = {}
        for idx, topic in lda_model.print_topics(-1):
            topics_payload[f"Topic {idx}"] = topic

        # Convert the payload to JSON
        topics_json = json.dumps(topics_payload)
        topics_dict = json.loads(topics_json)
        extracted_topics = {}

        for topic, words in topics_dict.items():
            word_components = [word.split('*')[1].strip().strip('"') for word in words.split(' + ')]
            first_four_words = word_components[:4]
            extracted_topics[topic] = first_four_words

        return jsonify({'answer':answer, 'topics':extracted_topics['Topic 0']})

@app.route("/get_suggestions", methods=['POST'])
def next_word_pred():
    """
    Accepts Form input(Question) as being typed by user through AJAX mechansim
    to provide list of possible following words in accordance to the given corpus

    :return: List of Suggestion in JSON Format.
    """
    
    data = request.get_json()
    text = data.get('value', '')  # Get the value associated with the key 'value'

    words = text.split(" ")
    words = " ".join(words[-3:])

    s = lstm_tokenizer.texts_to_sequences([words])
    s = np.array(s)
    preds = np.argmax(lstm_model.predict(s))
    predicted = ""

    for key, value in lstm_tokenizer.word_index.items():
        if value == preds:
            predicted += key

    return jsonify(result = predicted)


@app.route("/acc")
def acc():
    """
    :return: A HTML template for the Login page.
    """
    return render_template("acc.html")

@app.route("/about")
def tell():
    """
    :return: A HTML template for the documentation about the project.
    """
    return render_template("about.html")

if __name__ == "__main__":
    app.run(debug = True)

