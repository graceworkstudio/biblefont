import re

file_path = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace Headers
headers_old = """                    {/* 1. 찬송가유무 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.hymn.master} 
                          onChange={() => toggleMaster('hymn')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>1. 찬송가유무</span>
                      </label>
                    </th>
                    {/* 2. 해설유무 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.commentary.master} 
                          onChange={() => toggleMaster('commentary')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>2. 해설유무</span>
                      </label>
                    </th>
                    {/* 3. 재질 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.material.master} 
                          onChange={() => toggleMaster('material')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>3. 재질</span>
                      </label>
                    </th>
                    {/* 4. 크기/휴대성 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.portability.master} 
                          onChange={() => toggleMaster('portability')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>4. 크기/휴대성</span>
                      </label>
                    </th>
                    {/* 5. 글씨크기 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.fontSize.master} 
                          onChange={() => toggleMaster('fontSize')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>5. 글씨크기</span>
                      </label>
                    </th>
                    {/* 6. 출판사 */}
                    <th className="px-4 py-3 w-1/6 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.publisher.master} 
                          onChange={() => toggleMaster('publisher')} 
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>6. 출판사</span>
                      </label>
                    </th>"""

headers_new = """                    {/* 1. 성경번역본 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-[14%] select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filters.translation.master} onChange={() => toggleMaster('translation')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer" />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>1. 성경번역본</span>
                      </label>
                    </th>
                    {/* 2. 찬송가유무 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-[14%] select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filters.hymn.master} onChange={() => toggleMaster('hymn')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer" />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>2. 찬송가유무</span>
                      </label>
                    </th>
                    {/* 3. 해설유무 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-[14%] select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filters.commentary.master} onChange={() => toggleMaster('commentary')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer" />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>3. 해설유무</span>
                      </label>
                    </th>
                    {/* 4. 재질 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-[14%] select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filters.material.master} onChange={() => toggleMaster('material')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer" />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>4. 재질</span>
                      </label>
                    </th>
                    {/* 5. 크기/용도 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-[14%] select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filters.portability.master} onChange={() => toggleMaster('portability')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer" />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>5. 크기/용도</span>
                      </label>
                    </th>
                    {/* 6. 글씨크기 */}
                    <th className="px-4 py-3 border-r border-slate-200 w-[14%] select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filters.fontSize.master} onChange={() => toggleMaster('fontSize')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer" />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>6. 글씨크기</span>
                      </label>
                    </th>
                    {/* 7. 출판사 */}
                    <th className="px-4 py-3 w-[14%] select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filters.publisher.master} onChange={() => toggleMaster('publisher')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer" />
                        <span className="font-black text-slate-700" style={{ fontSize: 'var(--font-instruction-body)' }}>7. 출판사</span>
                      </label>
                    </th>"""

if headers_old in content:
    content = content.replace(headers_old, headers_new)
    print("Headers replaced.")
else:
    print("Could not find headers_old.")

# 2. Find and insert the new td block for translation
td_insert_point = """                    {/* 1. 찬송가유무 옵션들 */}
                    <td className={`px-4 py-4 border-r border-slate-200 align-top transition-opacity duration-200 ${!filters.hymn.master && Object.values(filters.hymn.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>"""

translation_td = """                    {/* 1. 성경번역본 옵션들 */}
                    <td className={`px-4 py-4 border-r border-slate-200 align-top transition-opacity duration-200 ${!filters.translation.master && Object.values(filters.translation.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>
                      <div className="flex flex-col gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input type="checkbox" checked={filters.translation.options.revised} onChange={() => toggleOption('translation', 'revised')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors" />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>개역개정</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input type="checkbox" checked={filters.translation.options.korean} onChange={() => toggleOption('translation', 'korean')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors" />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>개역한글</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input type="checkbox" checked={filters.translation.options.new} onChange={() => toggleOption('translation', 'new')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors" />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>새번역</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input type="checkbox" checked={filters.translation.options.easy} onChange={() => toggleOption('translation', 'easy')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors" />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>쉬운성경</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input type="checkbox" checked={filters.translation.options.modern} onChange={() => toggleOption('translation', 'modern')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors" />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>현대인의성경</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input type="checkbox" checked={filters.translation.options.woori} onChange={() => toggleOption('translation', 'woori')} className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors" />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>우리말성경</span>
                        </label>
                      </div>
                    </td>
                    
                    {/* 2. 찬송가유무 옵션들 */}
                    <td className={`px-4 py-4 border-r border-slate-200 align-top transition-opacity duration-200 ${!filters.hymn.master && Object.values(filters.hymn.options).every(v => !v) ? 'opacity-40' : 'opacity-100'}`}>"""

if td_insert_point in content:
    content = content.replace(td_insert_point, translation_td)
    print("Translation TD inserted.")
else:
    print("Could not find td_insert_point.")


# 3. Rename comments for remaining options
content = content.replace("{/* 2. 해설유무 옵션들 */}", "{/* 3. 해설유무 옵션들 */}")
content = content.replace("{/* 3. 재질 옵션들 */}", "{/* 4. 재질 옵션들 */}")
content = content.replace("{/* 4. 크기/휴대성 옵션들 */}", "{/* 5. 크기/용도 옵션들 */}")
content = content.replace("{/* 5. 글씨크기 옵션들 */}", "{/* 6. 글씨크기 옵션들 */}")
content = content.replace("{/* 6. 출판사 옵션들 */}", "{/* 7. 출판사 옵션들 */}")

# 4. Add wedding option to portability
wedding_insert_old = """                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>강대용</span>
                        </label>
                      </div>
                    </td>"""

wedding_insert_new = """                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>강대용</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input 
                            type="checkbox" 
                            checked={filters.portability.options.wedding} 
                            onChange={() => toggleOption('portability', 'wedding')} 
                            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer transition-colors"
                          />
                          <span className="font-bold text-slate-600 group-hover:text-slate-800" style={{ fontSize: 'var(--font-hero-bullets)' }}>결혼성경</span>
                        </label>
                      </div>
                    </td>"""

if wedding_insert_old in content:
    content = content.replace(wedding_insert_old, wedding_insert_new)
    print("Wedding option inserted.")
else:
    print("Could not find wedding_insert_old.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
