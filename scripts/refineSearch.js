const containers = document.querySelectorAll('.field-header')
const sliders = document.querySelectorAll('input[type="range"]')
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
	With the sliders, the values should be handled based on
	The value of the other slider

	e.g. 	if the min slider is greater than the max slider, 
		you must move the max slider with it to prevent invalid ranges
*/
sliders.forEach((slider) => {
	slider.nextElementSibling.value = slider.value

	slider.addEventListener('input', (e) => {
		slider.nextElementSibling.value = e.target.value

		let adjacentSlider = null,
			doAdjacentCheck = true
		// get the container adjacent to this one (so we can adjust the min/max)
		try {
			adjacentSlider =
				slider.offsetParent.nextElementSibling === null
					? slider.offsetParent.previousElementSibling.querySelector(
							'input[type="range"]'
					  )
					: slider.offsetParent.nextElementSibling.querySelector(
							'input[type="range"]'
					  )
		} catch (TypeError) {
			// we don't need to perform the adjacent slider check
			doAdjacentCheck = false
		}

		if (!doAdjacentCheck) return

		if (slider.classList.contains('min')) {
			// this slider should reflect the minimum value in the range
			// don't let the sliders overlap
			if (adjacentSlider.value <= e.target.value) {
				adjacentSlider.value = e.target.value
				adjacentSlider.nextElementSibling.value = e.target.value
			}
		} else if (slider.classList.contains('max')) {
			// this slider will reflect the maximum value in the range
			// don't let the sliders overlap
			if (adjacentSlider.value >= e.target.value) {
				adjacentSlider.value = e.target.value
				adjacentSlider.nextElementSibling.value = e.target.value
			}
		}
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
	{ primary_release_date: 'First Release' },
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
