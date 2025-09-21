import {useLiveValue} from "live-value"
import {useViewEnv} from "../app/useViewEnv"
import {XMarkIcon} from "@heroicons/react/24/solid"
import * as M from "../app/Model"

export const SampleResources = () => {
  const {model} = useViewEnv()
  const itemList = useLiveValue(model.sampleResources)

  return (
    <>
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Sample Resources
        </h2>

        <ul className="space-y-3">
          <SampleResourcesList list={itemList} />
        </ul>
        <AddSampleResource />
      </div>
    </>
  )
}

export const SampleResourcesList = ({
  list,
}: {
  list: Array<M.SampleResourceVM>
}) => {
  return (
    <>
      {list.map((m) => (
        <SampleResource m={m} key={m.src.publicId} />
      ))}
    </>
  )
}

export const SampleResource = ({m}: {m: M.SampleResourceVM}) => {
  const {controller} = useViewEnv()
  const {src} = m
  const {publicId, name, age} = src

  const onDelete = (id: string) => {
    controller.onDeleteSampleResource(publicId)
  }

  return (
    <>
      <li className="bg-white rounded-xl shadow p-4 flex justify-between items-center hover:bg-gray-50">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-gray-500 text-sm">Age {age}</p>
        </div>
        <button
          className="text-red-500 hover:text-red-700 ml-4"
          onClick={() => onDelete(publicId)}
          aria-label={`Delete ${name}`}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </li>
    </>
  )
}

export const AddSampleResource = () => {
  const {model, controller} = useViewEnv()
  const addSampleModel = useLiveValue(model.addSampleResourceVM)
  const name = useLiveValue(addSampleModel.name)
  const age = useLiveValue(addSampleModel.age)
  const canAdd = useLiveValue(addSampleModel.canAdd)

  const onAdd = () => {
    controller.addSampleResource()
  }

  return (
    <>
      <div className="bg-white p-4 rounded-xl shadow flex flex-col gap-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Name"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => addSampleModel.setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Age"
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={age}
            onChange={(e) => addSampleModel.setAge(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="self-end bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:text-gray-900 disabled:cursor-not-allowed"
          disabled={!canAdd}
          onClick={() => onAdd()}
        >
          Add
        </button>
      </div>
    </>
  )
}
