import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MarkdownIt from '@/components/ui/MarkdownIt.vue';

describe('MarkdownIt Component XSS Protection', () => {
  it('should sanitize XSS attacks in markdown', async () => {
    // 测试基本的 XSS 攻击
    const xssMarkdown = 'Hello <script>alert("XSS")</script> World';
    const wrapper = mount(MarkdownIt, {
      props: {
        markdown: xssMarkdown
      }
    });

    // 等待组件挂载和渲染
    await wrapper.vm.$nextTick();

    // 检查渲染的 HTML 中是否包含被净化的内容
    const renderedContent = wrapper.html();
    expect(renderedContent).not.toContain('<script>alert("XSS")</script>');
    expect(renderedContent).toContain('Hello World');
  });

  it('should sanitize event-based XSS attacks', async () => {
    // 测试基于事件的 XSS 攻击
    const eventXssMarkdown = 'Click <a href="javascript:alert(\'XSS\')">here</a>';
    const wrapper = mount(MarkdownIt, {
      props: {
        markdown: eventXssMarkdown
      }
    });

    await wrapper.vm.$nextTick();

    const renderedContent = wrapper.html();
    expect(renderedContent).not.toContain('javascript:alert(\'XSS\')');
    expect(renderedContent).toContain('Click');
    expect(renderedContent).toContain('here');
  });

  it('should sanitize attribute-based XSS attacks', async () => {
    // 测试基于属性的 XSS 攻击
    const attributeXssMarkdown = '<div onclick="alert(\'XSS\')">Click me</div>';
    const wrapper = mount(MarkdownIt, {
      props: {
        markdown: attributeXssMarkdown
      }
    });

    await wrapper.vm.$nextTick();

    const renderedContent = wrapper.html();
    expect(renderedContent).not.toContain('onclick="alert(\'XSS\')"');
    expect(renderedContent).toContain('Click me');
  });

  it('should allow safe HTML tags', async () => {
    // 测试安全的 HTML 标签是否被保留
    const safeMarkdown = '<p>Hello <strong>world</strong></p>';
    const wrapper = mount(MarkdownIt, {
      props: {
        markdown: safeMarkdown
      }
    });

    await wrapper.vm.$nextTick();

    const renderedContent = wrapper.html();
    expect(renderedContent).toContain('<p>Hello <strong>world</strong></p>');
  });

  it('should properly render markdown while sanitizing', async () => {
    // 测试 Markdown 渲染和 XSS 防护同时工作
    const mixedMarkdown = '# Heading\n\nHello <script>alert("XSS")</script>\n\n**Bold text**';
    const wrapper = mount(MarkdownIt, {
      props: {
        markdown: mixedMarkdown
      }
    });

    await wrapper.vm.$nextTick();

    const renderedContent = wrapper.html();
    expect(renderedContent).not.toContain('<script>alert("XSS")</script>');
    expect(renderedContent).toContain('<h1>Heading</h1>');
    expect(renderedContent).toContain('<strong>Bold text</strong>');
  });
});
