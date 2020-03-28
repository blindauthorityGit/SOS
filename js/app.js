document.addEventListener("DOMContentLoaded", function(event) {
    // Your code to run since DOM is loaded and ready

    const first = document.getElementById("first");
    const second = document.getElementById("second");
    const third = document.getElementById("third");
    const section2 = document.getElementById("section2");

    setTimeout(() => {
        first.classList.add("slide-in-fwd-center");
    }, 500);
    setTimeout(() => {
        second.classList.add("slide-in-fwd-center");
    }, 600);
    setTimeout(() => {
        third.classList.add("slide-in-fwd-center");
    }, 700);

    $(window).scroll(function() {
        if ($(this).scrollTop() > 350) {
            $("#section2Left").addClass("slide-in-left");
            $("#section2Right").addClass("slide-in-right");
        } else {
            $("#section2Left").removeClass("slide-in-left");
            $("#section2Right").removeClass("slide-in-right");
        }
    });

    setInterval(() => {
        console.log($(window).scrollTop());
    }, 1000);
});
