namespace System.Threading;

internal struct CancellationCallbackCoreWorkArguments(SparselyPopulatedArrayFragment<CancellationCallbackInfo> currArrayFragment, int currArrayIndex)
{
	internal SparselyPopulatedArrayFragment<CancellationCallbackInfo> m_currArrayFragment = currArrayFragment;

	internal int m_currArrayIndex = currArrayIndex;
}
