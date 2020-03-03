// See https://vuejs.org/v2/guide/render-function.html#The-Data-Object-In-Depth
export default {
  name: 'GenericForm',
  props: {
    validationSchema: {
      type: Object,
      required: true
    },
    interfaceSchema: {
      type: Array,
      required: true
    }
  },
  render (createElement) {
    return createElement(
      'div',
      {},
      Object.values(this.interfaceSchema).map(field =>
        createElement(field.component, { ...field.options })
      )
    )
  }
}
