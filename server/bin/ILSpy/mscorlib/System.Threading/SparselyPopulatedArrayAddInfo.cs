namespace System.Threading;

internal struct SparselyPopulatedArrayAddInfo<T>(SparselyPopulatedArrayFragment<T> source, int index) where T : class
{
	private SparselyPopulatedArrayFragment<T> m_source = source;

	private int m_index = index;

	internal SparselyPopulatedArrayFragment<T> Source => m_source;

	internal int Index => m_index;
}
