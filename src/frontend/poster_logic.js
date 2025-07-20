const form = document.getElementById("generate_form")
const posterContainerList = document.getElementById("poster_list_container")

form.addEventListener("submit", generatePoster)

function generatePoster(e) {
    e.preventDefault();

    const formData = new FormData(form);
    const params = new URLSearchParams(formData);
    const imageUrl = `/poster?${params.toString()}`;

    fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            const posterContainerElement = document.createElement('div');
            const imageElement = document.createElement('img');

            imageElement.src = URL.createObjectURL(blob);
            imageElement.classList.add(["poster_img"])

            posterContainerElement.classList.add(["poster_container"])
            posterContainerElement.appendChild(imageElement)
            posterContainerList.insertBefore(posterContainerElement, posterContainerList.firstChild);
        })
}