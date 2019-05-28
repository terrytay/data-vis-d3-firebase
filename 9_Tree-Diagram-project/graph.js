/* eslint-disable no-case-declarations */
import * as d3 from 'd3'
import db from './firebase'

//* ========== UI ELEMENTS ===========
//? UI CONSTANTS
const graphDims = { width: 1100, height: 500 }
const margins = { width: 100, height: 100 }

//? CREATE SVG CONTAINER ELEMENT
const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', graphDims.width + margins.width)
  .attr('height', graphDims.height + margins.height)

//? APPEND GRAPH GROUP TO SVG
const graph = svg
  .append('g')
  .attr('transform', `translate(${margins.width / 2}, ${margins.height / 2})`)

//

//* =========== DATA FUNCTIONS ===========
//? DATA STRATIFICATION
const stratify = d3
  .stratify()
  .id(d => d.name)
  .parentId(d => d.parent)

//? TREE GENERATOR
const tree = d3.tree().size([graphDims.width, graphDims.height])

//? UPDATE FUNCTION
const update = data => {
  const rootNode = stratify(data)
  // console.log(rootNode)
  const treeData = tree(rootNode)
  // console.log(treeData)

  // Get nodes selection and join data ('descendants' converts data object to an array)
  // console.log(treeData.descendants())
  const nodes = graph.selectAll('.node').data(treeData.descendants())
}

//? DATA OBJECT
let data = []

//? REAL-TIME DATA LISTENER
db.collection('employees').onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = { ...change.doc.data(), id: change.doc.id }

    switch (change.type) {
      case 'added':
        data.push(doc)
        break
      case 'modified':
        const index = data.findIndex(item => item.id === doc.id)
        data[index] = doc
        break
      case 'removed':
        data = data.filter(item => item.id !== doc.id)
        break
      default:
        break
    }
  })

  update(data)
})
