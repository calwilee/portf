// console.log('IT’S ALIVE!');

// let navLinks = $$("nav a")
// function $$(selector, context = document) {
//   return Array.from(context.querySelectorAll(selector));
// }
// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );
// currentLink.classList.add('current');
// currentLink?.classList.add('current');


let pages = [
    { url: '', title: 'Home', target: '' },
    { url: 'projects/', title: 'Projects', target: '' },
    { url: 'contact/', title: 'Contact', target: '' },
    { url: 'resume/', title: 'Resume', target: '' },
    { url: 'https://github.com/calwilee/', title: 'Github', target: '_blank' },
    // add the rest of your pages here
  ];
let nav = document.createElement('nav');

document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    

    const ARE_WE_HOME = document.documentElement.classList.contains('home');
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

    let a = document.createElement('a');
    
    
    a.href = url;
    a.textContent = title;
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    };
    if (a.host != location.host) {
        a.target = "_blank"
    };
    nav.append(a);

    
  }
