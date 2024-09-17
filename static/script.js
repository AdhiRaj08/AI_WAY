function create(id){
    let pop = document.querySelector(id);
    let overlay = pop.querySelector(".overlay");
    let close = pop.querySelector(".close-btn");
    function open(){
        pop.classList.add("active");
    }
    function closepop(){
        pop.classList.remove("active");
    }
    overlay.addEventListener("click", closepop);
    close.addEventListener("click", closepop);
    return open;
}

let popup = create("#pop");
document.querySelector("#openpop").addEventListener("click", popup);

function renderResults(results){
    if(!results.length){
        return searchwrap.classList.remove('show');
    }

    // Construct HTML content for search results
    const content = results.map((item) => {
        return `<li>${item}</li>`;
    })
    .join('');

    // Show the search wrap and update the resultswarp with search results
    searchwrap.classList.add('show');
    resultswarp.innerHTML = `<ul>${content}</ul>`;
}

//--------------------------------------------------------------------------------------

var selectedWord = '';
$(document).ready(function() {
    var suggestionsLoaded = true;
    var ajaxRequest;

    function loadSuggestions() {
        selectedWord = ' ';
        var value = document.getElementById('search').value;                // Retrieve the input value
        ajaxRequest = $.ajax({
            url: '/get_suggestions',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 'value': value }),                       // Send the input value in the AJAX request
            success: function(response) {
                var suggestions = response.result;
                var suggestion = document.getElementById('suggestions');
                suggestions.innerHTML = '';                                  // Clear existing content
                
                for (var i = 0; i < suggestions.length; i++) {
                    var p = document.createElement('span'); 
                    p.textContent = suggestions[i];  // Set the entire word as the text content
                    p.className = 'suggestions';  
                    suggestion.appendChild(p);
                    selectedWord += p.textContent;
                }
                    // console.log(selectedWord);
                document.body.addEventListener('click', function(event) {
                    if (!event.target.closest('.suggestions')) {
                        // Clicked outside of suggestion box
                        suggestion.innervalueHTML = '';  // Clear the suggestion box
                    }
                });
            }
        });
    }

    // Load suggestions when spacebar is pressed
    $(document).keypress(function(event) {
        if (event.keyCode === 32 && suggestionsLoaded) {
            loadSuggestions();
            var suggestion = document.getElementById('suggestions');
            suggestion.innerHTML = "";
            suggestionsLoaded = true;
        }
    });

    // Stop the AJAX request for suggestions when the submit button is clicked
    $('#submit-button').click(function() {
        suggestionsLoaded = false;
        var suggestion = document.getElementById('suggestions');
        $('.suggestions').empty();
        ajaxRequest.abort();
        suggestion.style.display === "none"
    });
});

function appendToSearchBox() {
    document.getElementById('search').value += selectedWord.trim();
    selectedWord = '';
    var suggestion = document.getElementById('suggestions');
    
    document.body.addEventListener('click', function(event) {
        suggestion.innerHTML = ''; 
        if (!event.target.closest('.suggestions')) {
            // Clicked outside of suggestion box
            suggestion.innerHTML = "";  
        }
    });
    suggestion.style.display === "none"
}

document.querySelector('.close-btn').addEventListener('click', function() {
    document.getElementById('pop').style.display = 'none';
});
document.getElementById('pdf-upload').addEventListener('change', function(e) {
    const pdfFileInput = document.getElementById('pdf-upload');
    const label = document.getElementById('button');

    // Check if a file is selected
    if (pdfFileInput.files.length > 0) {
        label.innerHTML = pdfFileInput.files[0].name;
        label.style.fontSize = '20px';
        label.style.backgroundColor = '#2d8f85';
    } else {
        label.innerHTML = 'Upload PDF';
        label.style.color = 'white';
    }
});


document.getElementById('myForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData();
    const pdfFileInput = document.getElementById('pdf-upload');
    const label = document.getElementById('button');
    const serachBox = document.getElementById('search');
    
    //Check if a file is selected
    if (pdfFileInput.files.length === 0) {
        alert("Please upload a PDF file.");
        return;
    }
    
    //Append the PDF file and the query to FormData
    formData.append('pdf', pdfFileInput.files[0]); 
    const query = document.getElementById('search').value;
    formData.append('search', query);

    //Send a fetch request to the server with the FormData
    fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
    })
    .then(response =>{
        // Check if the response is in JSON format\
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse JSON response
    })
    .then(data => {
        // Parse the returned HTML and extract the answery
        var answerDiv = document.querySelector('.ans');
        console.log(data.answer);
        console.log(data.topics);
        answerDiv.innerHTML = data.answer; 
        var topicsz = document.getElementById('topics');
        document.getElementById('o1').innerHTML = data.topics[0];
        document.getElementById('o2').innerHTML = data.topics[1];
        document.getElementById('o3').innerHTML = data.topics[2];
        document.getElementById('o4').innerHTML = data.topics[3];
        
        document.getElementById('pop').style.display = 'block';
    })
    .catch(error => {
        console.log('There was a problem with the fetch operation:', error);
    })
    .finally(() => {
        label.innerHTML = 'Upload PDF';
        serachBox.value = '';
        label.style.backgroundColor = '#052b2f';
        label.style.fontSize = '16px';
        document.getElementById('myForm').reset();
    });
});
