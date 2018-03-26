window.onload = function () {
    const form = document.getElementById("searchForm");
    form.addEventListener('submit', searchMovies);
};

function searchMovies(e) {
    e.preventDefault(); // Gia na min kanei refresh o browser me to patima toy submit

    const keyword = document.getElementById("keyword").value; // Pairnoyme tin timi poy xei grapsei o xristis sto element keyword

    let ajax = new XMLHttpRequest();

    ajax.open("POST", "http://35.195.44.39:4001/movie");

    ajax.setRequestHeader("Content-Type", "application/json");

    // edw kalw to ajax
    ajax.send(JSON.stringify({
        "keyword": keyword
    }));

    ajax.onreadystatechange = function () {
        //edw pairnw apantisi apo to API
        if (this.readyState === 4 && this.status === 200) {
            // Apothikeyw se pinaka apo JSON tin apantisi
            let movies = JSON.parse(this.responseText);

            // Pairnw ton pinaka apo to html
            const tableMovies = document.getElementById("tableMovies");

            // Dimoyrgia header pinaka (prwtis grammis)
            tableMovies.innerHTML = `                
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Genres</th>
                    <th>Rating</th>
                </tr>    
            `
            // console.log(movies); an thelw na dw sto console tis tainies

            //Dimioyrgia ypoloipon grammwn pinaka analoga tis tainies
            for (let i = 0; i < movies.length; i++) {

                //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
                tableMovies.innerHTML += `
                    <tr>
                        <td>${movies[i].movieId}</td>
                        <td>${movies[i].title}</td>
                        <td>${movies[i].genres}</td>
                        <td>
                            <input name="${movies[i].movieId}" type="radio" value="1">
                            <input name="${movies[i].movieId}" type="radio" value="2">
                            <input name="${movies[i].movieId}" type="radio" value="3">
                            <input name="${movies[i].movieId}" type="radio" value="4">
                            <input name="${movies[i].movieId}" type="radio" value="5">
                            <button name="${movies[i].movieId}" class="rating-button" type="button">Submit Rating</button>
                        </td>
                    </tr>
                `

            }

            // einai to class gia to submit tu rating
            let ratingButtons = document.getElementsByClassName("rating-button");

            for (let i = 0; i < ratingButtons.length; i++) {

                ratingButtons[i].addEventListener("click", rateMovie)

            }


        }
    }


}

//
let movieRatings = [];


function rateMovie(e) {
    const buttonPushed = e.target;
    let radioButton = document.getElementsByName(buttonPushed.name);
    // Vriskw to checked radio button gia tin sygkekrimeni tainia
    for (let i = 0; i < radioButton.length; i++) {
        const rating = parseInt(radioButton[i].value);
        if (radioButton[i].checked === true) {
            let exists = false;
            for (let j = 0; j < movieRatings.length; j++) {
                if (movieRatings[j].movieId === parseInt(buttonPushed.name)) {
                    exists = true;
                    movieRatings[j].rating = rating;
                }
            }

            if (!exists) { // an exists = true -> den mpainei an einai false mpainei
                const movieId = parseInt(buttonPushed.name);
                movieRatings.push({
                    "movieId": movieId,
                    "rating": rating
                })
            }


        }
    }
    console.log(movieRatings);
    let arrayIds = [];
    let arrayRatings = [];

    for (let i = 0; i < movieRatings.length; i++) {
        arrayIds.push(movieRatings[i].movieId);
        arrayRatings.push(movieRatings[i].rating);
    }

    //TODO: TBC

    if (movieRatings.length >= 3) {
        let recommended = document.getElementById("recommended");
        recommended.innerHTML = '';

        let ajax = new XMLHttpRequest();

        ajax.open("POST", "http://35.195.44.39:4001/ratings");

        ajax.setRequestHeader("Content-Type", "application/json");


        ajax.send(JSON.stringify({
            "movieList": arrayIds
        }));

        ajax.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                let ratingsByUsers = JSON.parse(this.responseText);

                console.log(ratingsByUsers);
                let otherUsersRatings = [];
                for (let i = 0; i < ratingsByUsers.length; i++) {
                    let userId = ratingsByUsers[i].userId;
                    let rating = ratingsByUsers[i].rating;
                    let exists = false;
                    for (let j = 0; j < otherUsersRatings.length; j++) {
                        if (userId === otherUsersRatings[j].userId) {
                            exists = true;
                            otherUsersRatings[j].ratings.push(rating);
                        }
                    }

                    if (!exists) {
                        otherUsersRatings.push({ /// [{userId: 10, ratings: [5,2]}, {userId: 11, ratings: [3]}]
                            "userId": userId,
                            "ratings": [rating]
                        });
                    }
                }

                let scoresPerOtherUser = [];
                for (let i = 0; i < otherUsersRatings.length; i++) {
                    if (otherUsersRatings[i].ratings.length === arrayRatings.length) {
                        let score = getPearsonCorrelation(arrayRatings, otherUsersRatings[i].ratings);
                        scoresPerOtherUser.push({
                            "userId": otherUsersRatings[i].userId,
                            "score": score
                        });
                    }
                }
                //https://stackoverflow.com/questions/4020796/finding-the-max-value-of-an-attribute-in-an-array-of-objects

                const maxScoreUser = scoresPerOtherUser.reduce(function (prev, current) {
                    return (prev.score > current.score) ? prev : current
                });

                console.log("Max User");
                console.log(maxScoreUser);


                let ajax = new XMLHttpRequest();

                ajax.open("GET", "http://35.195.44.39:4001/ratings/" + maxScoreUser.userId);

                ajax.send(null);

                ajax.onreadystatechange = function () {
                    if (ajax.readyState === 4 && ajax.status === 200) {
                        let movieRatingsByBestUser = JSON.parse(ajax.responseText);
                        let recommendedMovies = [];
                        for (let i = 0; i < movieRatingsByBestUser.length; i++) {
                            if (movieRatingsByBestUser[i].rating >= 4) {
                                let ajaxMovie = new XMLHttpRequest();

                                ajaxMovie.open("GET", "http://35.195.44.39:4001/movie/" + parseInt(movieRatingsByBestUser[i].movieId));
                                ajaxMovie.send(null);
                                ajaxMovie.onreadystatechange = function () {
                                    if (ajaxMovie.readyState === 4 && ajaxMovie.status === 200) {
                                        let movieDetails = JSON.parse(ajaxMovie.responseText);
                                        let movie = movieDetails[0];
                                        recommendedMovies.push(movie);


                                        if (recommendedMovies.length <=5) {
                                            recommended.innerHTML += `
                                                                            
                                            <div>
                                                ${movie.title}
                                            </div> `
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

        }


    }

}


/*
 *  Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/
 */
function getPearsonCorrelation(x, y) {
    let shortestArrayLength = 0;

    if (x.length === y.length) {
        shortestArrayLength = x.length;
    } else if (x.length > y.length) {
        shortestArrayLength = y.length;
        console.error('x has more items in it, the last ' + (x.length - shortestArrayLength) + ' item(s) will be ignored');
    } else {
        shortestArrayLength = x.length;
        console.error('y has more items in it, the last ' + (y.length - shortestArrayLength) + ' item(s) will be ignored');
    }

    let xy = [];
    let x2 = [];
    let y2 = [];

    for (let i = 0; i < shortestArrayLength; i++) {
        xy.push(x[i] * y[i]);
        x2.push(x[i] * x[i]);
        y2.push(y[i] * y[i]);
    }

    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_x2 = 0;
    let sum_y2 = 0;

    for (let i = 0; i < shortestArrayLength; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += xy[i];
        sum_x2 += x2[i];
        sum_y2 += y2[i];
    }

    let step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
    let step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
    let step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
    let step4 = Math.sqrt(step2 * step3);
    let answer = step1 / step4;

    return answer;
}