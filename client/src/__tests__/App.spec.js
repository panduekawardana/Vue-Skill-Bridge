import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('App', () => {
  it('renders router-view placeholder', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', name: 'home', component: { template: '<div>Home</div>' } }],
    })
    const wrapper = mount(App, {
      global: { plugins: [router] },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
