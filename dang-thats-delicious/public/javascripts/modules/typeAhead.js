import axios from 'axios'
import dompurify from 'dompurify'

function searchResultsHTML(stores) {
  return stores.map(store => {
    return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `
  }).join('') //this will give back one string of html, instead of an array of 3 strings
}

//listen for when somebody types into search box
//then, hit API endpoint with the value that is being typed, one keystroke at a time, concatenating the results each time
//wait for results to come back, so we can add a dropdown value
function typeAhead(search) {
  if (!search) return //if search isn't on the page, don't run the function at all

  const searchInput = search.querySelector('input[name="search"]')
  const searchResults = search.querySelector('.search__results')

  //on() is from bling.js
  searchInput.on('input', function () {

    if (!this.value) {
      searchResults.style.display = 'none' //if there is no value because someone deletes all the way to nothing, get rid of the search bar
      return //stop
    }
    //show the search results
    searchResults.style.display = 'block'
    searchResults.innerHTML = '' //show nothing if there are no results

    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data))
          return
        }
        //tell user no results
        searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${this.value} found!</div>`)
      })
      .catch(err => {
        console.error(err)
      })
  })

  //handle keyboard inputs
  searchInput.on('keyup', (e) => {
    //if they aren't pressing up, down or enter, skip it
    if (![38, 40, 13].includes(e.keyCode)) {
      return
    }
    const activeClass = 'search__result--active' //just so we don't have to write this a lot
    const current = search.querySelector(`.${activeClass}`) //this is the one the user is keying up or down to, or hovering over
    const items = search.querySelectorAll('.search__result') //all the search results
    let next
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0]
    } else if (e.keyCode === 40) {
      next = items[0]
      //if they press up and there's already a selection
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1]
    } else if (e.keyCode === 38) {
      next = items[items.length - 1]
    } else if (e.keyCode === 13 && current.href) {
      console.log('changing pages!')
      console.log(current)
      window.location = current.href
      return
    }
    if (current) {
      current.classList.remove(activeClass)
    }
    next.classList.add(activeClass)
    console.log(next)
  })
}

export default typeAhead