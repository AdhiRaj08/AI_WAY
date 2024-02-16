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

let searches = [
    'Elastic',
    'Fungus'
];

const searchin = document.getElementById('search');
const searchwrap = document.querySelector('.wrap');
const resultswarp = document.querySelector('.results');

searchin.addEventListener('keyup', ()=> {
    let res = [];
    let input = searchin.value;
    if(input.length){
        res = searches.filter((item) => {
            return item.toLowerCase().includes(input.toLowerCase());
        });
    }
    renderResults(res);
});

function renderResults(results){
    if(!results.length){
        return searchwrap.classList.remove('show');
    }

    const content = results.map((item) => {
        return `<li>${item}</li>`;
    })
    .join('');
    searchwrap.classList.add('show');
    resultswarp.innerHTML = `<ul>${content}</ul>`;
}

// Function to create a suggestion box
function createSuggestionBox(id) {
    let searchWrap = document.querySelector(id);
    let resultsWrap = searchWrap.querySelector('.results');

    function showResults() {
        searchWrap.classList.add('show');
    }

    function hideResults() {
        searchWrap.classList.remove('show');
    }

    searchWrap.addEventListener('click', hideResults);

    return {
        showResults,
        hideResults,
        updateResults: function(results) {
            if (!results.length) {
                hideResults();
                return;
            }

            const content = results.map(item => `<li>${item}</li>`).join('');
            resultsWrap.innerHTML = `<ul>${content}</ul>`;
            showResults();
        }
    };
}

// Create a suggestion box for the search input
let suggestionBox = createSuggestionBox("#wrap");

