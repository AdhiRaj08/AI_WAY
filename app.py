"""
Flask Application for handling HTTP requests and responses.

This application defines routes for handling user requests from JS.
Below are the necessary libraries and models used in the project
"""

from flask import Flask, url_for, redirect, render_template, Response, request, jsonify
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
import goslate
from langdetect import detect
from textblob import TextBlob
import langid
from collections import Counter
import pdfplumber       
from transformers import TFAutoModelForQuestionAnswering, AutoTokenizer, pipeline
import pickle
import numpy as np
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Embedding, Dense
from tensorflow.keras.models import load_model
import numpy as np
import nltk
import utkit
import polygot
from polyglot.detect import Detector
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import gensim
from gensim import corpora
import fitz
import cv2

# Global Variables and Models
text_content = ""                                           # Stores text content extracted from PDF
tokens = ""                                                 # Stores tokenized words
model = load_model('next_words.h5')                         # Stores LSTM model
cnn_model = tf.keras.models.load_model("resnet.h5")         # Stores R-CNN model 
tokenizer = pickle.load(open('token.pkl', 'rb'))            # Stores pre-trained tokenizer

# Details regarding the Hugging Face Transformer used
model_name = "deepset/tinyroberta-squad2"
nlp = pipeline('question-answering', model=model_name, tokenizer=model_name)
app = Flask(__name__)

@app.route("/")
def home():
   """
    Renders the home page template.

    :return: A rendered HTML template for the home page.
    """
   return render_template("bo.html")

@app.errorhandler(404)
def page_not_found(error):
    """
    Error handler for 404 Not Found.

    :param error: The error object.
    :return: A rendered HTML template for the 404 error page.
    """
    return render_template('404.html'), 404

@app.route('/submit', methods = ['POST', 'GET'])
def submit():
    """
    Accepts Form inputs and utilize them in generating answer using sota models

    :return: The Corpus/text fetched as per the scope of question in JSON Format.
    """
    if request.method == 'POST':
        text_content = request.form['pdf'] # corresponds to name
        question = request.form['search']
        resized_images = []

        # Converting PDF into stack of Images
        c = 0
        with pdfplumber.open('/content/national_security_strategy.pdf') as pdf:
            text_content = ""
            for page in pdf.pages:
                pixmap = page.get_pixmap()
                image_file = f"page_{c + 1}.png"
                c = c+1
                pixmap.writePNG(image_file)

        pdf.close()

        # HCR using R-CNN model to deal with pdf comprised of handwritten text images
        for img in pixmap:
            resized_img = cv2.resize(img, (224, 224), interpolation=cv2.INTER_AREA)
            resized_images.append(resized_img)
            resized_images = np.array(resized_images)
            features = cnn_model.predict(resized_images)
            text_content.append()


        # Perform language detection using Polyglot
        def detect_majority_language(doc):
            detector = Detector(doc)
            detected_language = detector.language.code
            return detected_language

        # Perform language conversion using Goslate API
        gs = goslate.Goslate()
        gs.translate(question, detect_majority_language(text_content[:300]))



        # Translated Questions are sent into QnA system for information retrival
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = TFAutoModelForQuestionAnswering.from_pretrained(model_name)

        inputs = tokenizer(question, text_content, return_tensors='tf', max_length=512, truncation=True)
        outputs = model(inputs)
        start_scores, end_scores = outputs.start_logits, outputs.end_logits

        start_index = tf.argmax(start_scores, axis=1).numpy()[0]
        end_index = (tf.argmax(end_scores, axis=1) + 1).numpy()[0]

        answer_tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"].numpy()[0][start_index:end_index])
        answer_content = tokenizer.convert_tokens_to_string(answer_tokens)

        return render_template('bo.html', answer_content = answer_content)


@app.route("/get_suggestions", methods = 'POST')
def next_word_pred():
    """
    Accepts Form input(Question) as being typed by user through AJAX mechansim
    to provide list of possible following words in accordance to the given corpus

    :return: List of Suggestion in JSON Format.
    """
    
    text = request.get_json()
    text = text.split(" ")
    text = text[-3:]

    s = tokenizer.texts_to_sequences([text_content])
    s = np.array(s)
    preds = np.argmax(model.predict(s))
    predicted = ""

    for key, value in tokenizer.word_index.items():
        if value == preds:
            predicted += key

    return jsonify(result = predicted)

@app.route("/upload")
def upload():
    """
    Accepts Form input(PDF) and utilize it for generating the top 5 Subject Topics in given corpus
    Utlizing LSTM model

    :return: List of popular Topics.
    """
    punctuation = [',', '.', ';', ':', '!', '?', "'"]
    tokens = [word for word in tokens if word not in punctuation and word not in stopwords.words('english') and not word.isdigit()]
    lemmatizer = WordNetLemmatizer()
    lemmatized_tokens = [lemmatizer.lemmatize(word) for word in tokens]

    document = ' '.join([word for word in lemmatized_tokens if len(word) > 2])
    
    texts = [doc.split() for doc in [document]]
    dictionary = corpora.Dictionary(texts)
    corpus = [dictionary.doc2bow(text) for text in texts]
    lda = gensim.models.ldamodel.LdaModel(corpus, num_topics=3, id2word=dictionary, passes=15)
    document_topics = lda.get_document_topics(corpus[0], minimum_probability=0.0)
    sorted_topics = sorted(document_topics, key=lambda x: x[1], reverse=True)
    top_5_topics = sorted_topics[:3]
    topics = lda.show_topics(num_topics=1, num_words=5, formatted=False)
    top = []
    for topic_id, topic in topics:
        word_freq = {word: freq for word, freq in topic}
        top.append({word for word, freq in topic})
    
    return render_template('bo.html', topics_content = top) 


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
