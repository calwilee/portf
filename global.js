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
    { url: '/portf/', title: 'Home', target: '' },
    { url: '/portf/projects/', title: 'Projects', target: '' },
    { url: '/portf/contact/', title: 'Contact', target: '' },
    { url: '/portf/resume/', title: 'Resume', target: '' },
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

document.body.insertAdjacentHTML(
'afterbegin',
`
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>`
);

let select =  document.querySelector('select');
if ("colorScheme" in localStorage){
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    select.value = localStorage.colorScheme;
};

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    localStorage.colorScheme = event.target.value;
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    

  });