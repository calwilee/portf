let selectedCommits = [];
let commitProgress = 100; // percentage of time for the slider
let filteredCommits = [];
let data = [];
let commits = [];
const width = 1000;
const height = 600;
let xScale;
let yScale;
let commitMaxTime;
let timeSlider;
let timeScale;
let itemsContainer;

// Function to update the display of the selected time
function updateTimeDisplay() {
  console.log(timeSlider.value)
  commitProgress = Number(timeSlider.value);
  commitMaxTime = timeScale.invert(commitProgress);
  selectedTime.textContent = commitMaxTime.toLocaleString();
  filterCommitsByTime(commitMaxTime);
  updateScatterplot(filteredCommits);
  updateFileDetails(); // Update file details after time update
}

// Function to filter commits by time
function filterCommitsByTime(commitMaxTime) {
  filteredCommits = commits.filter((commit) => commit.datetime <= commitMaxTime);
  console.log(filteredCommits)
  updateFileDetails(); // Update file details whenever commits are filtered
}

// Function to update file details
function updateFileDetails() {
  // Extract lines and files from the filtered commits
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });
  files = d3.sort(files, (d) => -d.lines.length);


  // Clear previous file details
  d3.select('.files').selectAll('div').remove();

  // Create new file details
  let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');

  // Append file names and line count
  filesContainer.append('dt')
    .append('code')
    .html(d => `${d.name} <small>${d.lines.length} lines</small>`); // File name with line count
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  // Append lines as individual divs inside the dd
  filesContainer.append('dd')
      .selectAll('div')
      .data(d => d.lines)
      .enter()
      .append('div')
      .attr('class', 'line')
      .style('background', d => fileTypeColors(d.type)); // Each line as a dot
}

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  processCommits();
  displayStats();
}

document.addEventListener('DOMContentLoaded', async () => {
  timeSlider = document.getElementById('time-slider');
  console.log(timeSlider.value);

  await loadData();
  timeScale = d3.scaleTime([d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)], [0, 100]);
  timeSlider.addEventListener('input', updateTimeDisplay);

  updateTimeDisplay(); // Update the time display after data is loaded

  updateScatterplot(commits); // Call with all commits on page load
  updateTooltipVisibility(false);
  brushSelector();
  lodeall();
  setupscrollthing();
});

// Create commit objects from raw data
function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        enumerable: true,
        configurable: false,
      });

      return ret;
    });
}

// Display stats (total commits, max lines, etc.)
function displayStats() {
  processCommits();

  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Maximum Lines of code edited in a commit');
  dl.append('dd').text(d3.max(commits, (c) => c.totalLines));

  dl.append('dt').text('Maximum Depth');
  dl.append('dd').text(d3.max(data, (d) => d.depth));

  dl.append('dt').text('Longest Line');
  dl.append('dd').text(d3.max(data, (d) => d.length));

  let daycount = d3.rollup(data, (d) => d.length, (d) => d.date.toLocaleDateString('en-US', { weekday: 'long' }));
  daycount = Array.from(daycount);
  dl.append('dt').text('Most Active Day');
  dl.append('dd').text(daycount[0][0]);
}

// Create scatterplot function
function updateScatterplot(filteredCommits) {
  d3.select('svg').remove(); // first clear the svg
  const svg = d3.select('#chart').append('svg').attr('viewBox', `0 0 ${width} ${height}`).style('overflow', 'visible');

  xScale = d3.scaleTime().domain(d3.extent(filteredCommits, (d) => d.datetime)).range([0, width]).nice();
  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
  const [minLines, maxLines] = d3.extent(sortedCommits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([10, 20]);

  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle').remove();
  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      updateTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    });

  const gridlines = svg.append('g').attr('class', 'gridlines').attr('transform', `translate(${usableArea.left}, 0)`).style('stroke', 'lightgray').style('stroke-width', 0.5).style('opacity', 0.5);
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g').attr('transform', `translate(0, ${usableArea.bottom})`).call(xAxis);
  svg.append('g').attr('transform', `translate(${usableArea.left}, 0)`).call(yAxis);
}

// Tooltip functionality
function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  if (Object.keys(commit).length === 0) {
    link.href = '';
    link.textContent = '';
    date.textContent = '';
    return;
  }

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// Brushing functionality
function brushSelector() {
  const svg = document.querySelector('svg');
  d3.select(svg).call(d3.brush().on('start brush end', brushed));
  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  selectedCommits = !event.selection
    ? []
    : commits.filter((commit) => {
        let min = { x: event.selection[0][0], y: event.selection[0][1] };
        let max = { x: event.selection[1][0], y: event.selection[1][1] };
        let x = xScale(commit.datetime);
        let y = yScale(commit.hourFrac);

        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
      });
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateSelection() {
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
}

function updateLanguageBreakdown() {
  const container = document.getElementById('language-breakdown');
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const lines = selectedCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}


let NUM_ITEMS = 10; // Set based on your commit history
let ITEM_HEIGHT = 50; // You can adjust this
let VISIBLE_COUNT = 5; // Adjust as needed
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
const scrollContainer = d3.select('scroll-container');
const spacer = d3.select('spacer');
spacer.style('height', `${totalHeight}px`);
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
  renderItems(startIndex);
});


function lodeall(){
  itemsContainer = d3.select('#items-container');

  itemsContainer.selectAll('div').remove();


  // Re-bind commit data to the container
  itemsContainer.selectAll('div')
    .data(commits)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((d) => {
      // Create narrative for each commit
      return `
        <p>
          On ${d.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, I made
          <a href="${d.url}" target="_blank">
          'another commit'}
          </a>. I edited ${d.totalLines} lines across ${d3.rollups(d.lines, D => D.length, d => d.file).length} files.
          Then I looked over all I had made, and I saw that it was very good.
        </p>
      `;
    })
    .style('font-size', '13px')

}


function setupscrollthing() {
  const scrollContainer = d3.select('#scroll-container');
  scrollContainer.on('scroll', () => {
    ss = scrollContainer.node()
    const scrollTop = scrollContainer.property('scrollTop');
    const scrollLen = scrollContainer.property('scrollHeight') - scrollContainer.property('clientHeight');
    console.log(scrollTop,scrollLen);
    filteredCommits = scrollTop / scrollLen;
    let cutto = Math.floor(filteredCommits * (commits.length));
    updateScatterplot(commits.slice(0, cutto));
  });

}



