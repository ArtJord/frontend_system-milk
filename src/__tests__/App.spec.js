import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('monta sem erro', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })
})
