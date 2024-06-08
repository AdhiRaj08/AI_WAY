// Function to create a popup with open and close functionality
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
    // Event listeners to close the popup when clicking on the close button
    overlay.addEventListener("click", closepop);
    close.addEventListener("click", closepop);
    return open;
}

let popup = create("#pop");
document.querySelector("#openpop").addEventListener("click", popup);

// Function to render search results in the UI
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

document.getElementById('pdf-upload').addEventListener('change', function() {
    // Create a FormData object to store the file data
    var formData = new FormData();
    // Append the selected file to the FormData object
    formData.append('file', this.files[0]);

    // Send an AJAX request to the server with the FormData containing the file data
    $.ajax({
        url: '/upload',
        type: 'POST',
        data: formData,
        contentType: false,                                                 // Ensure proper content type for file upload
        processData: false,                                                 // Prevent jQuery from processing the data
        success: function(response) {
            // Handle success response from the server
            var topics = response.result;
            var submitBtns = document.getElementsByClassName('submit-btn');

            // Update the submit buttons with the retrieved topics
            for (var i = 0; i < submitBtns.length; i++) {
                submitBtns[i].innerHTML = '';                               // Clear existing content

                topics.forEach(function(str) {
                    var p = document.createElement('p');
                    p.textContent = str;
                    submitBtns[i].appendChild(p);
                });
            }
        }
    });
});
function validateFileInput() {
    var fileInput = document.getElementById('pdf-upload');
    if (!fileInput.files.length) {
        alert('Please select a PDF file.');
        return false;
    }
    else{
        console.log("FILE FOUND!!");
    }
    return true;
}
function validateFile() {
    var fileInput = document.getElementById('pdf-upload');
    if (!fileInput.files.length) {
        alert('Please select a PDF file.');
        return false;
    }
    return true;
}
var selectedWord = '';
$(document).ready(function() {
    //console.log('Loading suggestions...');
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
                    var p = document.createElement('span');  // Use <span> instead of <div>
                    p.textContent = suggestions[i];  // Set the entire word as the text content
                    p.className = 'suggestions';  // Add a class for styling
                    suggestion.appendChild(p);
                    selectedWord += p.textContent;
                }
                    console.log(selectedWord);
                document.body.addEventListener('click', function(event) {
                    if (!event.target.closest('.suggestions')) {
                        // Clicked outside of suggestion box
                        suggestion.innerHTML = '';  // Clear the suggestion box
                    }
                });
                    
                }
        });
    }

    // Load suggestions when spacebar is pressed
    $(document).keypress(function(event) {
        if (event.keyCode === 32 && suggestionsLoaded) {
            loadSuggestions();
            suggestionsLoaded = true;
        }
    });

    // Stop the AJAX request for suggestions when the submit button is clicked
    $('#submit-button').click(function() {
        suggestionsLoaded = false;
        $('.suggestions').empty();
        ajaxRequest.abort();
    });
});

function appendToSearchBox() {
    document.getElementById('search').value += selectedWord.trim();
    selectedWord = '';
    var suggestion = document.getElementById('suggestions');
    
    document.body.addEventListener('click', function(event) {
        if (!event.target.closest('.suggestions')) {
            // Clicked outside of suggestion box
            
            suggestion.innerHTML = '';  // Clear the suggestion box
            if (suggestion.style.display === "none") {
                suggestion.style.display = "block";
            } else {
                suggestion.style.display = "none";
            }
        }
    });
    
       
}
