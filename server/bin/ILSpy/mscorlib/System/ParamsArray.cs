namespace System;

internal struct ParamsArray
{
	private static readonly object[] oneArgArray;

	private static readonly object[] twoArgArray;

	private static readonly object[] threeArgArray;

	private readonly object arg0;

	private readonly object arg1;

	private readonly object arg2;

	private readonly object[] args;

	public int Length => args.Length;

	public object this[int index]
	{
		get
		{
			if (index != 0)
			{
				return GetAtSlow(index);
			}
			return arg0;
		}
	}

	public ParamsArray(object arg0)
	{
		this.arg0 = arg0;
		arg1 = null;
		arg2 = null;
		args = oneArgArray;
	}

	public ParamsArray(object arg0, object arg1)
	{
		this.arg0 = arg0;
		this.arg1 = arg1;
		arg2 = null;
		args = twoArgArray;
	}

	public ParamsArray(object arg0, object arg1, object arg2)
	{
		this.arg0 = arg0;
		this.arg1 = arg1;
		this.arg2 = arg2;
		args = threeArgArray;
	}

	public ParamsArray(object[] args)
	{
		int num = args.Length;
		arg0 = ((num > 0) ? args[0] : null);
		arg1 = ((num > 1) ? args[1] : null);
		arg2 = ((num > 2) ? args[2] : null);
		this.args = args;
	}

	private object GetAtSlow(int index)
	{
		return index switch
		{
			1 => arg1, 
			2 => arg2, 
			_ => args[index], 
		};
	}

	static ParamsArray()
	{
		oneArgArray = new object[1];
		twoArgArray = new object[2];
		threeArgArray = new object[3];
	}
}
