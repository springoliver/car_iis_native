using System.Runtime.InteropServices;

namespace System.Collections;

[Serializable]
[ComVisible(true)]
[__DynamicallyInvokable]
public struct DictionaryEntry(object key, object value)
{
	private object _key = key;

	private object _value = value;

	[__DynamicallyInvokable]
	public object Key
	{
		[__DynamicallyInvokable]
		get
		{
			return _key;
		}
		[__DynamicallyInvokable]
		set
		{
			_key = value;
		}
	}

	[__DynamicallyInvokable]
	public object Value
	{
		[__DynamicallyInvokable]
		get
		{
			return _value;
		}
		[__DynamicallyInvokable]
		set
		{
			_value = value;
		}
	}
}
