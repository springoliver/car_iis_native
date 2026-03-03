using System.Security;

namespace System;

internal unsafe struct UnSafeCharBuffer(char* buffer, int bufferSize)
{
	[SecurityCritical]
	private unsafe char* m_buffer = buffer;

	private int m_totalSize = bufferSize;

	private int m_length = 0;

	public int Length => m_length;

	[SecuritySafeCritical]
	public unsafe void AppendString(string stringToAppend)
	{
		if (!string.IsNullOrEmpty(stringToAppend))
		{
			if (m_totalSize - m_length < stringToAppend.Length)
			{
				throw new IndexOutOfRangeException();
			}
			fixed (char* src = stringToAppend)
			{
				Buffer.Memcpy((byte*)m_buffer + (nint)m_length * (nint)2, (byte*)src, stringToAppend.Length * 2);
			}
			m_length += stringToAppend.Length;
		}
	}
}
