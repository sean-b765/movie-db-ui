const containers = document.querySelectorAll('.field-header')
const sliders = document.querySelectorAll('input[type="range"].customRange')
const singleSliders = document.querySelectorAll(
	'input[type="range"].singleRange'
)
const filterValues = document.querySelectorAll('input.value')

const date = new Date()
const year = date.getFullYear()
const release = document.getElementById('release')
release.previousElementSibling.value = year
release.value = year

/*
	When clicking the field headers (drop downs)
	Add the open class which will show the appropriate inputs
 */
containers.forEach((element) => {
	element.addEventListener('click', () => {
		// get the parent of this element so we can add the 'open' class to the wrapper
		const { offsetParent } = element
		if (offsetParent.classList.contains('open')) {
			offsetParent.classList.remove('open')
		} else {
			offsetParent.classList.add('open')
		}
	})
})

/*
	With the custom sliders, the values should be handled based on
	The value of the other slider

	e.g. 	if the min slider is greater than the max slider, 
		you must move the max slider with it to prevent invalid ranges
*/
sliders.forEach((slider) => {
	// initialize values
	slider.nextElementSibling.value = slider.value

	slider.addEventListener('input', (e) => {
		const current = e.target.classList[0]

		const min = document.getElementById('minRating').previousElementSibling
		const max = document.getElementById('maxRating').previousElementSibling

		console.log('\nmin:', min.value, '\nmax:', max.value)

		if (current === 'min') {
			if (parseFloat(min.value) > parseFloat(max.value)) {
				max.value = min.value
			}
		} else if (current === 'max') {
			if (parseFloat(max.value) < parseFloat(min.value)) {
				min.value = max.value
			}
		}

		max.nextElementSibling.value = max.value
		min.nextElementSibling.value = min.value
	})
})

// For slider/range inputs which is a single value, not a range of values
//  e.g. release year is a single value input, rating is a range (has a min,max)
singleSliders.forEach((slider) => {
	slider.addEventListener('input', (e) => {
		const nextSibling = slider.nextElementSibling
		nextSibling.value = e.target.value
	})
})

const allowedValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
/*
  Only allow numeric and .
  +Ensure the input is always between the min and max of slider
  Prevent pasting
*/
filterValues.forEach((item) => {
	item.addEventListener('paste', (e) => {
		e.preventDefault()
	})
	item.addEventListener('keypress', (e) => {
		e.preventDefault()

		if (e.key in allowedValues || e.key === '.') {
			// The key being input is allowed as it is 0-9 or a point ( . )

			const max = item.previousElementSibling.getAttribute('max')

			const newVal = parseFloat(item.value + e.key)
			// if the input is not within the slider max and min, return
			if (newVal > parseFloat(max)) {
				return
			}
			// now we can set the value
			item.value += e.key
			item.previousElementSibling.value = item.value
		}
	})
})

// All sortBy options excluding popularity as it is already in the DOM
const validFilters = [
	{ release_date: 'Release Date' },
	{ revenue: 'Box Office' },
	{ vote_average: 'Rating' },
	{ vote_count: 'Rating Count' },
]

const select = document.querySelector('section.sort .select select')
validFilters.forEach((filter) => {
	const option = document.createElement('option')

	let realVal = Object.keys(filter)[0]
	let showVal = Object.values(filter)[0]

	option.value = realVal
	option.innerHTML = showVal

	select.appendChild(option)
})
