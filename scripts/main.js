import { mobileMenu, mobileMenuOpener } from './ux.js'

const API_KEY = '6a2ae44babf3ff78b6e4d09363704281'

const IMAGE_PATH = 'https://image.tmdb.org/t/p/w1280'
const SEARCH_URL = `https://api.themoviedb.org/3/search/movie?&api_key=${API_KEY}&query=`

const form = document.getElementById('form')
const mobileForm = document.getElementById('mob-search')
const search = document.querySelector('#form #search')
const main = document.getElementById('main')

const sorts = {
	popularity: {
		desc: 'popularity.desc',
		asc: 'popularity.asc',
	},
}

let currentMedia = 'movie'
let page = 1
let sortBy = sorts.popularity.desc

/**
 * Get a request URL with parameters
 * @param {string} currentMedia the type (movie/tv)
 * @param {string} sortBy what filters to sort by
 * @param {number} page the page to look at
 * @returns {string} API URL
 */
const getUrl = (currentMedia, sortBy, page) => {
	return `https://api.themoviedb.org/3/discover/${currentMedia}?sort_by=${sortBy}&api_key=${API_KEY}&page=${page}`
}

getMedia(getUrl(currentMedia, sortBy, page))

// Get movies by popularity
async function getMedia(url) {
	const res = await fetch(url)
	const data = await res.json()
	console.log(url)

	mobileMenu.classList.remove('open')
	mobileMenuOpener.classList.remove('open')
	showMedia(data.results)
}

// Clear the main and append each movie (which has a poster)
function showMedia(movies) {
	main.innerHTML = ''

	movies.forEach((movie) => {
		const { title, poster_path, vote_average, overview } = movie

		const mediaElement = document.createElement('div')
		mediaElement.classList.add('media')

		// If poster_path is null
		// continue
		if (!poster_path) {
			return true
		}

		mediaElement.innerHTML = `
      <img src="${IMAGE_PATH + poster_path}" alt="${title}">
      <div class="info">
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
		main.appendChild(mediaElement)
	})
}

mobileForm.addEventListener('submit', (e) => {
	e.preventDefault()

	let searchTerm = mobileSearch.value

	if (mobileSearch && mobileSearch !== '') {
		mobileMenu.classList.remove('open')
		getMedia(SEARCH_URL + searchTerm + '"')
		mobileSearch.value = ''
	} else {
		console.log('Error searching')
	}
})

form.addEventListener('submit', (e) => {
	e.preventDefault()

	let searchTerm = search.value

	if (search && search !== '') {
		getMedia(SEARCH_URL + searchTerm + '"')
		search.value = ''
	} else {
		console.log('Error searching')
	}
})
