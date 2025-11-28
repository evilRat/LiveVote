import React, { useState } from 'react';
import { api } from '../services/api';
import { generatePollIdeas } from '../services/geminiService';
import { Button } from './Button';
import { Plus, Trash2, Wand2, ArrowRight, Layout, ArrowLeft } from 'lucide-react';

interface CreatePollProps {
  onCreated: () => void;
  onCancel: () => void;
}

export const CreatePoll: React.FC<CreatePollProps> = ({ onCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleAddOption = () => setOptions([...options, '']);
  
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    const result = await generatePollIdeas(aiPrompt);
    setIsGenerating(false);
    
    if (result) {
      setTitle(result.title);
      setOptions(result.options);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || options.some(o => !o.trim())) return;

    setIsSubmitting(true);
    try {
      await api.createPoll(title, options);
      onCreated();
    } catch (error) {
      console.error("Error creating poll", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onCancel} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={16} className="mr-2"/> 返回列表
          </Button>
        </div>

        <div className="text-center mb-10">
          <div className="mx-auto h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg transform -rotate-6">
            <Layout size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建投票活动</h1>
          <p className="mt-2 text-gray-600">手动创建新的投票活动，或使用 AI 助手一键生成。</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* AI Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-indigo-100">
            <label className="block text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <Wand2 size={16} className="text-indigo-600" />
              AI 助手
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例如：2025年最受欢迎的编程语言..."
                className="flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
              />
              <Button onClick={handleGenerateAI} isLoading={isGenerating} variant="secondary" className="whitespace-nowrap">
                一键生成
              </Button>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                活动名称
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm outline-none"
                placeholder="请输入投票主题..."
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                投票选项
              </label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 items-center group">
                  <span className="text-gray-400 font-mono text-sm w-6">{index + 1}.</span>
                  <input
                    type="text"
                    required
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="block flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm outline-none"
                    placeholder={`选项 ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              
              <Button type="button" variant="secondary" onClick={handleAddOption} className="mt-2 text-sm" icon={<Plus size={16} />}>
                添加选项
              </Button>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto text-lg px-8 py-3" icon={<ArrowRight />}>
                创建活动
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
