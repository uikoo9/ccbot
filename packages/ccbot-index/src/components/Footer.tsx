'use client';

import { useLocale } from 'next-intl';

export function Footer() {
  const locale = useLocale();

  const projects = [
    {
      domain: 'ccbot.dev',
      desc: 'Claude Code Bot',
      link: 'https://www.ccbot.dev/',
    },
    {
      domain: 'viho.fun',
      desc: locale === 'zh' ? 'AI 命令行工具' : 'AI CLI Tool',
      link: 'https://www.viho.fun/',
    },
    {
      domain: 'remotion.cool',
      desc: locale === 'zh' ? '视频创作平台' : 'Video Creation',
      link: 'https://www.remotion.cool/',
    },
    {
      domain: 'mcp-servers.online',
      desc: locale === 'zh' ? 'MCP 服务集合' : 'MCP Server Collection',
      link: 'https://mcp-servers.online/',
    },
    {
      domain: 'aibaiban.com',
      desc: locale === 'zh' ? 'AI 协作白板' : 'AI Whiteboard',
      link: 'https://aibaiban.com/',
    },
    {
      domain: 'aitubiao.online',
      desc: locale === 'zh' ? 'AI 图表生成' : 'AI Chart Generator',
      link: 'https://aitubiao.online/',
    },
  ];

  const openSource = [
    {
      name: 'qiao-z',
      desc: locale === 'zh' ? 'Node.js Web 框架' : 'Node.js Web Framework',
      link: 'https://qiao-z.vincentqiao.com/#/',
    },
    {
      name: 'qiao-ui',
      desc: locale === 'zh' ? 'React UI 组件库' : 'React UI Library',
      link: 'https://qiao-ui.vincentqiao.com/#/',
    },
    {
      name: 'qiao-webpack',
      desc: locale === 'zh' ? 'Webpack 脚手架' : 'Webpack Scaffolding',
      link: 'https://qiao-webpack.vincentqiao.com/#/',
    },
    {
      name: 'qiao-project',
      desc: locale === 'zh' ? 'Monorepo 工程化' : 'Monorepo Tooling',
      link: 'https://qiao-project.vincentqiao.com/#/',
    },
    {
      name: 'qiao-electron-cli',
      desc: locale === 'zh' ? 'Electron 打包工具' : 'Electron Packaging CLI',
      link: 'https://qiao-electron-cli.vincentqiao.com/#/',
    },
  ];

  return (
    <>
      <footer className="footer">
        <div className="container container-xl">
          <div className="footer-grid">
            {/* Column 1: Projects */}
            <div className="footer-column">
              <h4 className="footer-title">{locale === 'zh' ? '个人项目' : 'Projects'}</h4>
              {projects.map((item) => (
                <a key={item.domain} href={item.link} target="_blank" rel="noopener noreferrer" className="footer-link">
                  {item.domain} - {item.desc}
                </a>
              ))}
            </div>

            {/* Column 2: Open Source */}
            <div className="footer-column">
              <h4 className="footer-title">{locale === 'zh' ? '开源工具' : 'Open Source'}</h4>
              {openSource.map((item) => (
                <a key={item.name} href={item.link} target="_blank" rel="noopener noreferrer" className="footer-link">
                  {item.name} - {item.desc}
                </a>
              ))}
              <a
                href="https://code.vincentqiao.com/#/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link footer-link-more"
              >
                {locale === 'zh' ? '更多 50+ npm 包 →' : 'More 50+ npm packages →'}
              </a>
            </div>

            {/* Column 3: More */}
            <div className="footer-column">
              <h4 className="footer-title">{locale === 'zh' ? '更多' : 'More'}</h4>
              <a
                href={locale === 'zh' ? 'https://blog.vincentqiao.com/' : 'https://blog.vincentqiao.com/en/'}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                {locale === 'zh' ? '博客' : 'Blog'}
              </a>
              <a href="https://blog.csdn.net/uikoo9" target="_blank" rel="noopener noreferrer" className="footer-link">
                CSDN
              </a>
              <a
                href="https://code.vincentqiao.com/#/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                {locale === 'zh' ? '代码集合' : 'Code Collection'}
              </a>
            </div>

            {/* Column 4: Contact */}
            <div className="footer-column">
              <h4 className="footer-title">{locale === 'zh' ? '联系方式' : 'Contact'}</h4>
              <a href="https://github.com/uikoo9" target="_blank" rel="noopener noreferrer" className="footer-link">
                GitHub
              </a>
              <a
                href="https://resume.vincentqiao.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                {locale === 'zh' ? '简历' : 'Resume'}
              </a>
              <a href="mailto:hello@vincentqiao.com" className="footer-link">
                hello@vincentqiao.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sub Footer */}
      <div className="sub-footer">
        <div className="container container-xl">
          <span className="sub-footer-text">
            © 2026{' '}
            <a href="https://www.vincentqiao.com" target="_blank" rel="noopener noreferrer" className="sub-footer-link">
              vincentqiao.com
            </a>
            . All rights reserved.
          </span>
        </div>
      </div>
    </>
  );
}
