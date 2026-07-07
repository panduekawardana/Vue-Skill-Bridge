import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from '@/components/ui/Badge.vue'

describe('Badge', () => {
  it('renders default variant with slot content', () => {
    const wrapper = mount(Badge, {
      slots: { default: 'active' },
    })
    expect(wrapper.text()).toBe('active')
    expect(wrapper.classes()).toContain('inline-flex')
  })

  it('renders secondary variant', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'secondary' },
      slots: { default: 'completed' },
    })
    expect(wrapper.text()).toBe('completed')
  })

  it('renders outline variant', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'outline' },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders accent variant', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'accent' },
      slots: { default: 'info' },
    })
    expect(wrapper.text()).toBe('info')
  })

  it('applies custom class', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'default' },
      attrs: { class: 'custom-class' },
    })
    expect(wrapper.classes()).toContain('custom-class')
  })
})
