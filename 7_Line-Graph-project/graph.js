/* eslint-disable no-param-reassign */
/* eslint-disable import/no-mutable-exports */
/* eslint-disable no-case-declarations */
import * as d3 from 'd3'
import db from './firebase'
import { activity } from './index'

//* ======== CHART USER INTERFACE ==========
//? CREATE UI SVG, MARGIN, and GRAPH SETTINGS
const svgDims = { width: 560, height: 370 }
const margin = { top: 10, right: 20, bottom: 50, left: 100 }
const graphDims = {
  width: svgDims.width - margin.left - margin.right,
  height: svgDims.height - margin.top - margin.bottom,
}

//? CREATE OUR SVG and GRAPH / CHART GROUP
const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', svgDims.width)
  .attr('height', svgDims.height)

const graph = svg
  .append('g')
  .attr('width', graphDims.width)
  .attr('height', graphDims.height)
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

//? CREATE A LINE PATH ELEMENT
const path = graph.append('path')

//

//* ======== SCALES AND AXES GROUPS ==========
const xScale = d3.scaleTime().range([0, graphDims.width])
const yScale = d3.scaleLinear().range([graphDims.height, 0])

const xAxisGroup = graph
  .append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(0, ${graphDims.height})`)

const yAxisGroup = graph.append('g').attr('class', 'y-axis')

//

//* ======== APPLICATION LOGIC ==========
//? LINE PATH GENERATOR
const line = d3
  .line()
  .x(function(d) {
    return xScale(new Date(d.date))
  })
  .y(function(d) {
    return yScale(d.distance)
  })

//? UPDATE FUNCTION
export const update = data => {
  // Filter out data based on currently selected activity
  data = data.filter(item => item.activity === activity)
  // Sort data based on date field
  data.sort((a, b) => new Date(a.date) - new Date(b.date))

  // Set scale domains
  xScale.domain(d3.extent(data, d => new Date(d.date)))
  yScale.domain([0, d3.max(data, d => d.distance)])

  // Update line path with data to display it
  path
    .data([data])
    .attr('fill', 'none')
    .attr('stroke', '#00bfa5')
    .attr('stroke-width', 2)
    .attr('d', line)

  // Create circles for data points
  const circles = graph.selectAll('circle').data(data)

  // Remove deleted data points
  circles.exit().remove()

  // Update already existing data points
  circles
    .attr('cx', d => xScale(new Date(d.date)))
    .attr('cy', d => yScale(d.distance))

  // Add new data points
  circles
    .enter()
    .append('circle')
    .attr('r', 6)
    .attr('cx', d => xScale(new Date(d.date)))
    .attr('cy', d => yScale(d.distance))
    .attr('fill', '#ccc')

  // Animate circle data points to grow in size when hovered
  graph.selectAll('circle').on('mouseover', function() {
    d3.select(this)
      .transition('circleGrow')
      .duration(250)
      .attr('r', 10)
      .attr('fill', '#fff')
  })
  graph.selectAll('circle').on('mouseout', function() {
    d3.select(this)
      .transition('circleShrink')
      .duration(250)
      .attr('r', 6)
      .attr('fill', '#ccc')
  })

  // Create the axes
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(4)
    .tickFormat(d3.timeFormat('%b %d'))
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(4)
    .tickFormat(d => `${d} miles`)

  // Call axes (takes the axes and creates the needed shapes inside the groups)
  xAxisGroup.call(xAxis)
  yAxisGroup.call(yAxis)

  // Rotate x-axis text
  xAxisGroup
    .selectAll('text')
    .attr('text-anchor', 'end')
    .attr('transform', 'rotate(-40)')
}

//? Declare a data array
export let data = []

//? WATCH DATABASE FOR CHANGES IN REAL-TIME
db.collection('activities').onSnapshot(res => {
  res.docChanges().forEach(change => {
    // console.log(change)
    const doc = { ...change.doc.data(), id: change.doc.id }

    switch (change.type) {
      case 'added':
        data.push(doc)
        break
      case 'modified':
        const index = data.findIndex(item => item.id === doc.id)
        if (index > -1) data[index] = doc
        break
      case 'removed':
        data = data.filter(item => item.id !== doc.id)
        break
      default:
        break
    }
  })

  // Call update function
  update(data)
})
