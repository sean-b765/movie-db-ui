const API_KEY = '6a2ae44babf3ff78b6e4d09363704281'
const API_URL = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}&page=1`

const IMAGE_PATH = 'https://image.tmdb.org/t/p/w1280'
const SEARCH_URL = `https://api.themoviedb.org/3/search/movie?&api_key=${API_KEY}&query=`

const form = document.getElementById('form')
const search = document.querySelector('#form #search')
const mobileForm = document.getElementById('mob-search')
const mobileSearch = document.querySelector('#mob-search .search')
const main = document.getElementById('main')

const nav = document.querySelector('header.nav')

const mobileMenuOpener = document.querySelector('.mobile-menu-opener')
const mobileMenu = document.querySelector('.mob-menu-wrapper')

mobileMenuOpener.addEventListener('click', () => {
	updateMobileMenu()
})
function updateMobileMenu() {
	if (mobileMenu.classList.contains('open')) {
		mobileMenu.classList.remove('open')
		mobileMenuOpener.classList.remove('open')
	} else {
		mobileMenu.classList.add('open')
		mobileMenuOpener.classList.add('open')
	}
}

getMovies(API_URL)

// Get movies by popularity
async function getMovies(url) {
	const res = await fetch(url)
	const data = await res.json()

	mobileMenu.classList.remove('open')
	mobileMenuOpener.classList.remove('open')
	showMovies(data.results)
}

function showMovies(movies) {
	main.innerHTML = ''

	movies.forEach((movie) => {
		const { title, poster_path, vote_average, overview } = movie

		const movieElement = document.createElement('div')
		movieElement.classList.add('movie')

		// If poster_path is null
		// continue
		if (!poster_path) {
			return true
		}

		movieElement.innerHTML = `
      <img src="${IMAGE_PATH + poster_path}" alt="${title}">
      <div class="movie-info">
        <h3>${title}</h3>
        <span class="${
					vote_average > 5 ? (vote_average > 8 ? 'green' : 'yellow') : 'red'
				}">${vote_average}</span>
      </div>
      <div class="overview">
        <h3>Overview</h3>
        ${overview}
      </div>
    `
		main.appendChild(movieElement)
	})
}

mobileForm.addEventListener('submit', (e) => {
	e.preventDefault()

	let searchTerm = mobileSearch.value

	if (mobileSearch && mobileSearch !== '') {
		mobileMenu.classList.remove('open')
		getMovies(SEARCH_URL + searchTerm + '"')
		mobileSearch.value = ''
	} else {
		console.log('Error searching')
	}
})

form.addEventListener('submit', (e) => {
	e.preventDefault()

	let searchTerm = search.value

	if (search && search !== '') {
		getMovies(SEARCH_URL + searchTerm + '"')
		search.value = ''
	} else {
		console.log('Error searching')
	}
})

let lastYPos = 0
const handleScroll = () => {
	if (window.pageYOffset > lastYPos) {
		// user scrolled down
		nav.classList.add('scrolled')
	} else {
		// user scrolled up
		nav.classList.remove('scrolled')
	}

	lastYPos = window.pageYOffset
}

window.addEventListener('scroll', handleScroll)
