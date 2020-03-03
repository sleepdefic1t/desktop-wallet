<template>
  <div>
    <h1>Hello World</h1>
    <GenericForm
      v-model="model"
      :validation-schema="validationSchema"
      :interface-schema="interfaceSchema"
    />
  </div>
</template>

<script>
import GenericForm from './GenericForm'

export default {
  name: 'TransactionForm',

  components: {
    GenericForm
  },

  data () {
    return {
      model: {
        address: null,
        currency: null,
        password: null,
        switch: null,
        text: null,
        fee: null
      },
      validationSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string'
          },
          currency: {
            type: 'string'
          },
          password: {
            type: 'string'
          },
          switch: {
            type: 'string'
          },
          text: {
            type: 'string'
          },
          fee: {
            type: 'string'
          }
        }
      },
      interfaceSchema: [
        // {
        //   component: 'InputAddress',
        //   model: 'address'
        // },
        // {
        //   component: 'InputCurrency',
        //   model: 'currency'
        // },
        // {
        //   component: 'InputPassword',
        //   model: 'password'
        // },
        // {
        //   component: 'InputSwitch',
        //   model: 'switch'
        // },
        {
          component: 'InputText',
          model: 'text',
          options: {
            class: ['form-control'],
            on: {
              input (value) { console.log(value) }
            },
            attrs: {
              placeholder: 'Please enter your first name'
            },
            props: {
              label: 'First Name',
              name: 'first_name'
            }
          }
        }
        // {
        //   component: 'InputFee',
        //   model: 'fee'
        // }
      ]
    }
  },

  watch: {
    model (value) { console.log(value) }
  }
}
</script>
