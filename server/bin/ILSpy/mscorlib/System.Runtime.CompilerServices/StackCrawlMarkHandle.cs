namespace System.Runtime.CompilerServices;

internal struct StackCrawlMarkHandle(IntPtr stackMark)
{
	private IntPtr m_ptr = stackMark;
}
