const sideNav = document.querySelector(".sidenav");
M.Sidenav.init(sideNav, {});

const slider = document.querySelector(".slider");
M.Slider.init(slider, {
  indicators: false,
  height: 450,
  transition: 500,
  interval: 3000
});

$(".button-collapse").sideNav();

$(".collapsible").collapsible();

$("select").material_select();
