import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h1');
const projcount = Object.keys(projects).length;
const title = document.querySelector('.title');
title.innerHTML = `${projcount} Projects`
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);




let selectedIndex = -1;

let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
  // update query value
  query = event.target.value;
  // filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  // render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});

function renderPieChart(projectsGiven) {
    // re-calculate rolled data
    let newRolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
    // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator =  d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));
    let colors = d3.scaleOrdinal(d3.schemePastel1);

    // TODO: clear up paths and legends
    let svg = d3.select('svg');
    svg.selectAll('*').remove();
    let legend = d3.select('.legend');
    legend.html('');

    // update paths and legends, refer to steps 1.4 and 2.2
    newArcs.forEach((arc,idx) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
            .on('click', () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;

                svg
                    .selectAll('path')
                    .attr('class', (_, idx) => (
                    idx === selectedIndex ? 'selected' : ''
                    ));
                legend
                    .selectAll('li')
                    .attr('class', (_, idx) => (
                      idx === selectedIndex ? 'selected' : ''
                    ));
                    
                if (selectedIndex === -1) {
                    renderProjects(projects, projectsContainer, 'h2');
                } else {
                    const year = newData[selectedIndex].label;
                    const filteredProjects = projects.filter(project => project.year === year);
                    renderProjects(filteredProjects, projectsContainer, 'h2');
                }
              });;
    
    })
    newData.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`)
          .html(`<span class="swatch" style="background-color:${colors(idx)}"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
})
  }
  
  // Call this function on page load
renderPieChart(projects);
function setQuery(queryString) {
    return projects.filter(project => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(queryString.toLowerCase());
    });
}
searchInput.addEventListener('input', (event) => {
    let filteredProjects = setQuery(event.target.value);
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
    selectedIndex = -1;
});
