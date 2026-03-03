namespace System.Resources;

internal struct ResourceLocator(int dataPos, object value)
{
	internal object _value = value;

	internal int _dataPos = dataPos;

	internal int DataPosition => _dataPos;

	internal object Value
	{
		get
		{
			return _value;
		}
		set
		{
			_value = value;
		}
	}

	internal static bool CanCache(ResourceTypeCode value)
	{
		return value <= ResourceTypeCode.TimeSpan;
	}
}
