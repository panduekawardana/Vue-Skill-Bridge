import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/ui/Button.vue'

describe('Button', () => {
  it('renders default variant with slot content', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' },
    })
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('renders as button element by default', () => {
    const wrapper = mount(Button)
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('applies sm size class', () => {
    const wrapper = mount(Button, {
      props: { size: 'sm' },
    })
    expect(wrapper.classes()).toContain('h-9')
  })

  it('applies lg size class', () => {
    const wrapper = mount(Button, {
      props: { size: 'lg' },
    })
    expect(wrapper.classes()).toContain('h-11')
  })

  it('applies outline variant class', () => {
    const wrapper = mount(Button, {
      props: { variant: 'outline' },
    })
    expect(wrapper.classes()).toContain('border')
  })

  it('applies destructive variant class', () => {
    const wrapper = mount(Button, {
      props: { variant: 'destructive' },
    })
    expect(wrapper.classes()).toContain('bg-destructive')
  })

  it('applies ghost variant class', () => {
    const wrapper = mount(Button, {
      props: { variant: 'ghost' },
    })
    expect(wrapper.classes()).toContain('hover:bg-secondary')
  })

  it('renders with disabled attribute', () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      attrs: { disabled: '' },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('applies custom class via attrs', () => {
    const wrapper = mount(Button, {
      attrs: { class: 'my-custom-btn' },
    })
    expect(wrapper.classes()).toContain('my-custom-btn')
  })
})
