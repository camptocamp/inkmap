export default class OpenLayersParser {
  // returns an empty style after 10ms
  writeStyle() {
    return new Promise(resolve => setTimeout(() => resolve({ image: {}, fill: {}, stroke: {}}), 10))
  }
}
