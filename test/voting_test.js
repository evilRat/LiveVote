// voting.test.js
import { api } from '../services/api';
import { render, screen, waitFor, act } from '@testing-library/react';
import { VotingInterface } from '../components/VotingInterface';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock API服务器
const server = setupServer(
  // 模拟聚合API成功响应
  rest.get('/api/vote/prepare/:token', (req, res, ctx) => {
    const token = req.params.token;
    return res(ctx.json({
      success: true,
      data: {
        id: 'poll123',
        title: '测试投票',
        options: [
          { id: 'opt1', text: '选项1', count: 0 },
          { id: 'opt2', text: '选项2', count: 0 }
        ],
        createdAt: Date.now(),
        isActive: true
      }
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('VotingInterface 组件集成测试', () => {
  test('正常加载投票界面', async () => {
    render(<VotingInterface pollId="poll123" token="token123" />);
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('测试投票')).toBeInTheDocument();
    });
    
    // 验证选项显示
    expect(screen.getByText('选项1')).toBeInTheDocument();
    expect(screen.getByText('选项2')).toBeInTheDocument();
  });
  
  test('处理聚合API失败情况', async () => {
    // 临时修改服务器响应
    server.use(
      rest.get('/api/vote/prepare/:token', (req, res, ctx) => {
        return res(ctx.json({
          success: false,
          error: 'Token 不存在'
        }));
      })
    );
    
    render(<VotingInterface pollId="poll123" token="invalid_token" />);
    
    // 等待错误状态显示
    await waitFor(() => {
      expect(screen.getByText('链接失效')).toBeInTheDocument();
    });
  });
});